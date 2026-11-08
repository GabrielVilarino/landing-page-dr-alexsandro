import DepoimentosCarousel from "@/components/depoimentos-carousel";

export default function DepoimentosContainer() {
  const testimonials = [
    {
      text: "Minha consulta com o Dr. Alexsandro Araújo foi uma experiência excepcional. Sua dedicação em ouvir minhas preocupações, sua empatia e seu profundo conhecimento em emagrecimento saudável deixaram extremamente confiante em seu cuidado.",
      author: "Rose Cortez",
    },
    {
      text: "Excelente atendimento, muito atencioso e profissional. Desde a primeira consulta me senti muito confortável e seguro.",
      author: "Maria Silva",
    },
    {
      text: "Um profissional extremamente dedicado e cuidadoso. Recomendo para todos que procuram um atendimento de qualidade.",
      author: "João Santos",
    },
  ];
  return (
    <section className="flex flex-col gap-4 py-8 bg-[#E5E0DD] px-8 md:px-16 lg:px-32">
      <h1 className="text-[#92714E] font-bold text-2xl text-center">
        Depoimentos
      </h1>
      <DepoimentosCarousel testimonials={testimonials} />
    </section>
  );
}
