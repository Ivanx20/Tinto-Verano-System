import { ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function UnauthorizedPage() {
  return <Card className="mx-auto max-w-xl text-center"><ShieldAlert className="mx-auto mb-4 h-12 w-12 text-gold-500" /><h2 className="text-2xl font-black">No autorizado</h2><p className="mt-2 text-zinc-500">Tu usuario no tiene permisos para esta sección.</p></Card>;
}
