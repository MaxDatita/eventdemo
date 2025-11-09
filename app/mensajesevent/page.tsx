'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'

interface Message {
  id: number;
  nombre: string;
  mensaje: string;
}

interface DisplayMessage extends Message {
  x: number;
  y: number;
  opacity: number;
  key: string;
}

// Componente para mensaje individual
function MessageText({ mensaje, nombre }: { mensaje: string; nombre: string }) {
  return (
    <div className="text-center max-w-lg">
      <p 
        className="text-2xl font-literary font-semibold mb-2 text-white leading-relaxed italic"
        style={{ 
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word'
        }}
      >
        &ldquo;{mensaje}&rdquo;
      </p>
      <p className="text-lg font-normal text-white/90">
        — {nombre}
      </p>
    </div>
  );
}

export default function MensajesEventPage() {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])

  // Query para obtener mensajes aleatorios
  const messagesQuery = useQuery({
    queryKey: ['messages', 'cloud'],
    queryFn: async () => {
      const response = await fetch('/api/messages?random=true');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });

  const allMessages = useMemo(() => messagesQuery.data?.messages || [], [messagesQuery.data?.messages]);

  // Función para verificar si hay colisión entre mensajes
  const checkCollision = useCallback((x: number, y: number, existingMessages: DisplayMessage[], minDistance: number = 20) => {
    return existingMessages.some((msg) => {
      const dx = Math.abs(msg.x - x);
      const dy = Math.abs(msg.y - y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });
  }, []);

  // Función para generar posición aleatoria sin colisiones
  const getRandomPosition = useCallback((existingMessages: DisplayMessage[]) => {
    // Dejamos márgenes para evitar que los mensajes aparezcan en los bordes
    const margin = 15; // porcentaje
    const maxAttempts = 50; // Intentos máximos para encontrar una posición sin colisión
    let attempts = 0;

    while (attempts < maxAttempts) {
      const x = margin + Math.random() * (100 - 2 * margin);
      const y = margin + Math.random() * (100 - 2 * margin - 25); // -25 para dejar espacio al título y logo
      
      if (!checkCollision(x, y, existingMessages, 20)) {
        return { x, y };
      }
      attempts++;
    }

    // Si no se encontró posición sin colisión, devolver una posición aleatoria de todas formas
    return {
      x: margin + Math.random() * (100 - 2 * margin),
      y: margin + Math.random() * (100 - 2 * margin - 25),
    };
  }, [checkCollision]);

  // Función para agregar un nuevo mensaje
  const addMessage = useCallback(() => {
    if (allMessages.length === 0) return;

    setDisplayMessages((current) => {
      // Mantener máximo 8 mensajes visibles simultáneamente
      if (current.length >= 8) return current;

      const randomMessage = allMessages[Math.floor(Math.random() * allMessages.length)];
      const position = getRandomPosition(current);
      
      const newMessage: DisplayMessage = {
        ...randomMessage,
        x: position.x,
        y: position.y,
        opacity: 0,
        key: `${Date.now()}-${Math.random()}`,
      };

      // Animar fade in (más lento)
      setTimeout(() => {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            msg.key === newMessage.key ? { ...msg, opacity: 1 } : msg
          )
        );
      }, 50);

      // Remover mensaje después de mostrar (fade out más lento)
      setTimeout(() => {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            msg.key === newMessage.key ? { ...msg, opacity: 0 } : msg
          )
        );
        
        setTimeout(() => {
          setDisplayMessages((prev) => prev.filter((msg) => msg.key !== newMessage.key));
        }, 2500); // Tiempo de fade out más lento
      }, 8000); // Mostrar mensaje por 8 segundos

      return [...current, newMessage];
    });
  }, [allMessages, getRandomPosition]);

  // Efecto para gestionar la nube de mensajes
  useEffect(() => {
    if (allMessages.length === 0) return;

    // Agregar primer mensaje inmediatamente
    addMessage();

    // Intervalo para agregar nuevos mensajes
    const addInterval = setInterval(() => {
      addMessage();
    }, 3000); // Agregar nuevo mensaje cada 3 segundos

    return () => clearInterval(addInterval);
  }, [allMessages, addMessage]);

  return (
    <div className="fixed inset-0 bg-gradient-animation overflow-hidden">
      {/* Título */}
      <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="heading-h1 text-center text-cyan-200">
          Mensajes de los invitados
        </h1>
        <div className="mt-2 flex justify-center">
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full backdrop-blur-sm shadow-lg">
            <span className="text-xs font-bold">MODO DEMO</span>
          </div>
        </div>
      </div>

      {/* Contenedor de mensajes */}
      <div className="relative w-full h-full pt-24">
        {displayMessages.map((message) => (
          <div
            key={message.key}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-[2500ms] ease-in-out"
            style={{
              left: `${message.x}%`,
              top: `${message.y}%`,
              opacity: message.opacity,
            }}
          >
            <MessageText mensaje={message.mensaje} nombre={message.nombre} />
          </div>
        ))}
      </div>

      {/* Logo fijo abajo */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <Image
          src="/logo-fondo-oscuro.png"
          alt="Eventechy"
          width={200}
          height={71}
          className="rounded-lg eventechy-logo"
        />
      </div>
    </div>
  );
}

