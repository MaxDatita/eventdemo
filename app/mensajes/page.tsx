'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { demoMessages } from '@/data/demo-messages'
import { isBackgroundDark } from '@/config/theme'

interface CarouselMessage {
  id: number | string;
  nombre: string;
  mensaje: string;
}

export default function MensajesPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Query para el carrusel (aleatoria)
  const carouselQuery = useQuery({
    queryKey: ['messages', 'carousel'],
    queryFn: async () => {
      const response = await fetch('/api/messages?random=true');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });

  const carouselMessages = useMemo<CarouselMessage[]>(() => {
    const sheetMessages = (carouselQuery.data?.messages || [])
      .filter((msg: { nombre?: string; mensaje?: string }) => msg?.nombre && msg?.mensaje)
      .map((msg: { id?: number; nombre: string; mensaje: string }, index: number) => ({
        id: `sheet-${msg.id ?? index}`,
        nombre: msg.nombre,
        mensaje: msg.mensaje
      }));

    const demo = demoMessages.map(msg => ({
      id: `demo-${msg.id}`,
      nombre: msg.nombre,
      mensaje: msg.mensaje
    }));

    return [...demo, ...sheetMessages];
  }, [carouselQuery.data?.messages]);

  // Efecto para el carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => 
        prev === carouselMessages.length - 1 ? 0 : prev + 1
      );
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [carouselMessages.length]);

  useEffect(() => {
    if (currentSlide > Math.max(0, carouselMessages.length - 1)) {
      setCurrentSlide(0);
    }
  }, [carouselMessages.length, currentSlide]);

  return (
    <>
      <div className="bg-gradient-animation" />
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-4xl mx-auto relative z-10">
       
        {/* Título */}
        <h1 className="heading-h1 text-center mb-2">
          Mensajes de los invitados
        </h1>
        {/* Badge Modo Demo */}
        <div className="mb-6 flex justify-center">
          <div className="bg-[#FF914E] text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
        </div>

        {/* Carrusel de mensajes */}
        <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl min-h-[300px] flex items-center justify-center">
          {carouselMessages.map((message: CarouselMessage, index: number) => (
            <div
              key={index}
              className={`absolute w-full transition-opacity duration-1000 text-center ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="text-3xl font-light mb-4 text-white">
                &ldquo;{message.mensaje}&rdquo;
              </p>
              <p className="text-xl font-medium text-white/80">
                {message.nombre}
              </p>
            </div>
          ))}
        </div>

        {/* Indicadores */}
        <div className="flex justify-center gap-2 mt-4">
          {carouselMessages.map((_: CarouselMessage, index: number) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        {/* Logo */}
        <div className="mt-8 flex justify-center">
          <Image
            src={isBackgroundDark() ? '/logo-fondo-oscuro.png' : '/logo-fondo-claro.png'}
            alt="Eventechy"
            width={200}
            height={71}
            className="rounded-lg eventechy-logo"
          />
        </div>

        </div>
      </div>
    </>
  );
} 
