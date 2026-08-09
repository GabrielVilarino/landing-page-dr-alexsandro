
import Link from "next/link";
import CardServicos from "./card-servicos";

export default function ServicoContainer() {
  const areasDeAtuacao = [
    {
      image: "/servico1.png",
      title: "Emagrecimento",
      description: "Estratégias para redução de gordura e mudança corporal",
    },
    {
      image: "/servico2.png",
      title: "Avaliação Clínica",
      description: "Avaliação de atletas e praticantes de atividade física",
    },
    {
      image: "/servico3.png",
      title: "Prescrição de Exercícios",
      description: "Exercícios personalizados para saúde, prevenção e tratamento",
    },
    {
      image: "/servico4.png",
      title: "Alta Performance",
      description: "Acompanhamento para potencializar o desempenho esportivo",
    },
    {
      image: "/servico5.png",
      title: "Lesões Esportivas",
      description: "Prevenção, diagnóstico e tratamento de lesões",
    },
    {
      image: "/servico6.png",
      title: "Avaliação Cardiológica",
      description: "Avaliação pré-participação e aptidão física parao exercício",
    },
    {
      image: "/servico7.png",
      title: "Saúde e Performance",
      description: "Cuidado individualizado para atletas e iniciantes no exercício"
    },
  ]

  return (
    <section className="flex flex-col gap-8 py-8 bg-[#E5E0DD] px-8 md:px-16 lg:px-32">
      <h1 className="text-[#92714E] font-bold text-2xl text-center">Áreas de Atuação</h1>
      <div className="flex flex-wrap items-center justify-center gap-4">
          {areasDeAtuacao.map((area, index) => (
          <CardServicos
              key={index}
              image={area.image}
              title={area.title}
              description={area.description}
          />
          ))}
      </div>
      <div className="flex items-center justify-center">
        <Link 
          href={"#agendamento"}
          className=" bg-[#BF9462] text-[#FFFFFF] px-8 py-2 rounded-sm hover:bg-[#92714E] hover:cursor-pointer"
        >
          Agende sua consulta
        </Link>
      </div>
    </section>
  )
}