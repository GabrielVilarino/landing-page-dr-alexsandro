"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

type ImageCarouselProps = {
  images: string[];
};

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const autoplay = Autoplay({
    delay: 4000,
    stopOnInteraction: false,
  });

  return (
    <Carousel
      opts={{
        loop: true,
      }}
      plugins={[autoplay]}
      className="mx-auto w-full"
    >
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index}>
            <div className="relative h-100 w-full">
              <Image
                src={image}
                alt={`Imagem ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
