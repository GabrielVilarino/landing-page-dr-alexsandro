"use client";

import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel";
import { 
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { Label } from "@/components/ui/label";

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
            <Card className="bg-[#91704d] h-100">
              <CardContent className="flex flex-col text-white px-20 py-4 gap-2">
                <Image
                  src="/aspas.png" 
                  alt="Aspas"
                  width={50}
                  height={50}
                />
                <div className="flex h-full flex-col items-center justify-center text-center px-20 gap-4">
                  <Label className="text-lg">{testimonial.text}</Label>
                  <CardFooter className="bg-[#91704d] border-none">
                    <Label>— {testimonial.author}</Label>
                  </CardFooter>
                </div>
              </CardContent>
            </Card>
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