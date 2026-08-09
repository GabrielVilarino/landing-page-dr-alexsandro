"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";

type Testimonial = {
  text: string;
  author: string;
};

function CarouselDots({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const { api } = useCarousel();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const update = () => {
      setCurrent(api.selectedScrollSnap());
    };

    update();

    api.on("select", update);

    return () => {
      api.off("select", update);
    };
  }, [api]);

  if (!api) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {testimonials.map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => api.scrollTo(index)}
          className={`h-1.5 w-1.5 rounded-full transition-all ${
            current === index
              ? "scale-125 bg-[#222]"
              : "bg-[#222]/40"
          }`}
          aria-label={`Ir para depoimento ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default function DepoimentosCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const autoplay = Autoplay({
    delay: 5000,
    stopOnInteraction: false,
  });

  return (
    <Carousel
      opts={{
        loop: true,
      }}
      plugins={[autoplay]}
      className="mx-auto w-full max-w-200"
    >
      <CarouselContent>
        {testimonials.map((testimonial, index) => (
          <CarouselItem key={index}>
            <div className="relative h-100 rounded-lg bg-[#9A7854] px-10 py-7 text-white shadow-md">
              {/* Aspas */}
              <span className="absolute left-12 top-3 font-serif text-[52px] leading-none text-white/50">
                “
              </span>

              {/* Texto */}
              <p className="relative z-10 mx-auto max-w-280 text-center text-md">
                {testimonial.text}
              </p>

              {/* Autor */}
              <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium">
                — {testimonial.author}
              </p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Dots */}
      <div className="mt-4">
        <CarouselDots
          testimonials={testimonials} 
        />
      </div>
    </Carousel>
  );
}