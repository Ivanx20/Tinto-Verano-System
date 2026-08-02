import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return <Card className="mx-auto max-w-xl text-center"><h2 className="text-2xl font-black">Página no encontrada</h2><p className="mt-2 text-zinc-500">La ruta solicitada no existe.</p><Link to="/"><Button className="mt-5">Volver al dashboard</Button></Link></Card>;
}
