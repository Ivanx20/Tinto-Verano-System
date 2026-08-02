import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Flame, Lock, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Ingrese su contraseña')
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@tintoverano.local', password: 'Admin#2026.Tinto' }
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post('/auth/login', values);
      setSession(data.data.user, data.data.accessToken);
      navigate('/');
    } catch (error: any) {
      setError('root', { message: error.response?.data?.message ?? 'No se pudo iniciar sesión' });
    }
  }

  return (
    <div className="grid min-h-screen overflow-hidden bg-wine-900 text-cream lg:grid-cols-[1.1fr_.9fr]">
      <div className="relative hidden p-10 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(214,160,68,.35),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(138,16,32,.55),transparent_36%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between rounded-[3rem] border border-gold-300/20 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="mb-8 grid h-20 w-20 place-items-center rounded-full border-2 border-gold-300 text-gold-300"><Flame className="h-10 w-10" /></div>
            <h1 className="max-w-xl text-6xl font-black leading-tight">Tinto Verano System</h1>
            <p className="mt-6 max-w-lg text-lg text-cream/75">Gestión premium para restaurante: POS, mesas, comandas, inventario, caja, reportes y seguridad empresarial.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {['POS elegante', 'Inventario seguro', 'Reportes gerenciales'].map((item) => <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-center font-semibold">{item}</div>)}
          </div>
        </div>
      </div>
      <div className="grid place-items-center px-5 py-10">
        <motion.form initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-cream p-8 text-wine-900 shadow-2xl dark:bg-white/10 dark:text-cream">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-wine-800 text-gold-300"><Flame /></div>
            <h2 className="text-3xl font-black">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-300">Acceso seguro al panel administrativo</p>
          </div>
          <label className="mb-2 block text-sm font-bold">Correo</label>
          <div className="relative mb-4">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input-premium h-10 pl-9" {...register('email')} />
          </div>
          {errors.email && <p className="mb-3 text-sm text-red-600">{errors.email.message}</p>}
          <label className="mb-2 block text-sm font-bold">Contraseña</label>
          <div className="relative mb-4">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input className="input-premium h-10 pl-9" type="password" {...register('password')} />
          </div>
          {errors.password && <p className="mb-3 text-sm text-red-600">{errors.password.message}</p>}
          {errors.root && <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{errors.root.message}</p>}
          <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Validando...' : 'Entrar al sistema'}</button>
          <p className="mt-5 text-center text-xs text-zinc-500">Usuario inicial: admin@tintoverano.local</p>
        </motion.form>
      </div>
    </div>
  );
}
