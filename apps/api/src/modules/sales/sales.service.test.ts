import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../../database/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    sale: {
      findFirst: vi.fn(),
      update: vi.fn()
    }
  }
}));

import { prisma } from '../../database/prisma.js';
import { cancel, create } from './sales.service.js';

const prismaMock = prisma as unknown as {
  $transaction: Mock;
  sale: { findFirst: Mock; update: Mock };
};

const CARTA = [
  { id: 1, name: 'Encebollado', price: 3.5, isAvailable: true, isActive: true },
  { id: 2, name: 'Corvina frita', price: 12, isAvailable: true, isActive: true },
  { id: 3, name: 'Ceviche mixto', price: 8, isAvailable: false, isActive: true }
];

/**
 * Reemplaza la transaccion de Prisma por un contexto en memoria.
 * Devuelve los espias para poder revisar con que datos se habria guardado
 * la venta, sin necesidad de levantar PostgreSQL durante las pruebas.
 */
function prepararTransaccion(productos = CARTA) {
  const tx = {
    product: { findMany: vi.fn().mockResolvedValue(productos) },
    sale: {
      create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 101,
        ...data
      }))
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) }
  };

  prismaMock.$transaction.mockImplementation(async (callback: (ctx: typeof tx) => unknown) => callback(tx));
  return tx;
}

function ventaGuardada(tx: ReturnType<typeof prepararTransaccion>) {
  return tx.sale.create.mock.calls[0][0].data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Registro de una venta en el POS', () => {
  it('calcula subtotal, IVA del 15 % y total de una comanda con dos productos', async () => {
    const tx = prepararTransaccion();

    await create({
      saleType: 'DINE_IN',
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 }
      ],
      payments: [{ method: 'CASH', amount: 21.85 }]
    });

    const venta = ventaGuardada(tx);
    expect(venta.subtotal).toBeCloseTo(19, 2);
    expect(venta.tax).toBeCloseTo(2.85, 2);
    expect(venta.total).toBeCloseTo(21.85, 2);
    expect(venta.status).toBe('COMPLETED');
    expect(venta.details.create).toHaveLength(2);
  });

  it('aplica el descuento de linea, el descuento global y el servicio antes del impuesto', async () => {
    const tx = prepararTransaccion();

    await create({
      saleType: 'DINE_IN',
      discount: 2,
      serviceFee: 2,
      items: [{ productId: 2, quantity: 2, discount: 2 }],
      payments: [{ method: 'CARD', amount: 25 }]
    });

    const venta = ventaGuardada(tx);
    expect(venta.subtotal).toBeCloseTo(22, 2);
    expect(venta.discount).toBeCloseTo(2, 2);
    expect(venta.serviceFee).toBeCloseTo(2, 2);
    expect(venta.tax).toBeCloseTo(3, 2);
    expect(venta.total).toBeCloseTo(25, 2);
  });

  it('respeta el precio enviado desde el POS por encima del precio de la carta', async () => {
    const tx = prepararTransaccion();

    await create({
      saleType: 'TAKEAWAY',
      items: [{ productId: 1, quantity: 1, unitPrice: 4 }],
      payments: [{ method: 'CASH', amount: 4.6 }]
    });

    const venta = ventaGuardada(tx);
    expect(venta.details.create[0].unitPrice).toBe(4);
    expect(venta.total).toBeCloseTo(4.6, 2);
  });

  it('guarda el numero de venta y el cajero que la registro', async () => {
    const tx = prepararTransaccion();

    await create(
      {
        saleType: 'DINE_IN',
        items: [{ productId: 1, quantity: 1 }],
        payments: [{ method: 'CASH', amount: 4.025 }]
      },
      42
    );

    const venta = ventaGuardada(tx);
    expect(String(venta.saleNumber)).toMatch(/^VT-\d+$/);
    expect(venta.cashierId).toBe(42);
  });

  it('deja registro en la bitacora de auditoria', async () => {
    const tx = prepararTransaccion();

    await create(
      {
        saleType: 'DINE_IN',
        items: [{ productId: 1, quantity: 1 }],
        payments: [{ method: 'CASH', amount: 4.025 }]
      },
      42
    );

    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create.mock.calls[0][0].data).toMatchObject({
      userId: 42,
      action: 'sales.create',
      entity: 'sales'
    });
  });
});

describe('Validaciones que protegen la caja', () => {
  it('rechaza una venta sin productos', async () => {
    prepararTransaccion();

    await expect(create({ saleType: 'DINE_IN', items: [] })).rejects.toMatchObject({
      statusCode: 400,
      message: 'La venta debe incluir al menos un producto'
    });
  });

  it('rechaza un producto que no existe en la carta', async () => {
    prepararTransaccion();

    await expect(
      create({
        saleType: 'DINE_IN',
        items: [{ productId: 99, quantity: 1 }],
        payments: [{ method: 'CASH', amount: 1 }]
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rechaza un producto marcado como no disponible', async () => {
    prepararTransaccion();

    await expect(
      create({
        saleType: 'DINE_IN',
        items: [{ productId: 3, quantity: 1 }],
        payments: [{ method: 'CASH', amount: 9.2 }]
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rechaza la venta cuando el pago no cuadra con el total', async () => {
    prepararTransaccion();

    await expect(
      create({
        saleType: 'DINE_IN',
        items: [{ productId: 2, quantity: 1 }],
        payments: [{ method: 'CASH', amount: 10 }]
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'El total de pagos no cuadra con el total de la venta'
    });
  });

  it('exige cliente asociado cuando el pago es a credito', async () => {
    prepararTransaccion();

    await expect(
      create({
        saleType: 'DINE_IN',
        items: [{ productId: 2, quantity: 1 }],
        payments: [{ method: 'CREDIT', amount: 13.8 }]
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Las ventas a crédito requieren cliente asociado'
    });
  });

  it('acepta la venta a credito y la marca con estado CREDIT', async () => {
    const tx = prepararTransaccion();

    await create({
      saleType: 'DINE_IN',
      customerId: 5,
      items: [{ productId: 2, quantity: 1 }],
      payments: [{ method: 'CREDIT', amount: 0 }]
    });

    const venta = ventaGuardada(tx);
    expect(venta.status).toBe('CREDIT');
    expect(venta.customerId).toBe(5);
  });
});

describe('Anulacion de ventas', () => {
  it('cambia el estado a CANCELLED cuando la venta existe', async () => {
    prismaMock.sale.findFirst.mockResolvedValue({ id: 101, deletedAt: null });
    prismaMock.sale.update.mockResolvedValue({ id: 101, status: 'CANCELLED' });

    await cancel(101, 42);

    expect(prismaMock.sale.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: { status: 'CANCELLED', updatedBy: 42 }
    });
  });

  it('lanza 404 al intentar anular una venta inexistente', async () => {
    prismaMock.sale.findFirst.mockResolvedValue(null);

    await expect(cancel(999, 42)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Venta no encontrada'
    });
  });
});
