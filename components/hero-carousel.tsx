"use client"

import { useEffect, useState } from "react";
import Image from "next/image"

import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext,
} from "@/components/ui/carousel"

import type { CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const slides = [
  {
    image: "/teste-1.png",
    title: "Assistência Médica",
    description: "Conheça nossos serviços e especialidades",
    button: "Saiba mais",
  },
  {
    image: "/teste-1.png",
    title: "Cuidado especializado",
    description: "Atendimento humanizado e especializado",
    button: "Saiba mais",
  },
  {
    image: "/teste-1.png",
    title: "Nossa equipe",
    description: "Profissionais preparados para cuidar de você",
    button: "Saiba mais",
  },
]

export default function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const autoplay = Autoplay({
    delay: 3000,
    stopOnInteraction: false,
  });

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => {
      setCurrent(api.selectedScrollSnap());
    };

    updateCurrent();

    api.on("select", updateCurrent);

    return () => {
      api.off("select", updateCurrent);
    };
  }, [api]);

  return (
    <div className="relative w-full">
      <Carousel
        setApi={setApi} 
        plugins={[autoplay]}
        opts={{
          loop: true,
        }}
        className="w-full">
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative h-100 w-full overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute inset-0 flex items-center">
                  <div className="ml-[10%] max-w-87.5 text-white">
                    <h2 className="text-xl sm:text-3xl font-bold">
                      {slide.title}
                    </h2>

                    <p className="mt-3 text-sm">
                      {slide.description}
                    </p>

                    <button className="mt-5 rounded bg-[#BF9462] px-5 py-2 text-sm transition-colors hover:bg-[#92714E] hover:cursor-pointer">
                      {slide.button}
                    </button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselNext className="right-6 border-none bg-transparent text-white hover:bg-transparent hover:text-white" />
      </Carousel>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              current === index
                ? "bg-white"
                : "bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}