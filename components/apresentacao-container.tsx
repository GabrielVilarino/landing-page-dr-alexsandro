import Image from "next/image";

export default function ApresentacaoContainer() {
  return (
    <section id="apresentacao" className="py-8 bg-[#664e33] px-8 md:px-16 lg:px-32">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-16">
        <Image 
          src="/foto-apresentacao.png"
          alt="Foto de Apresentação"
          width={300}
          height={300}
          className="w-50 h-50 sm:w-75 sm:h-75"
        />
        <div className="flex flex-col text-center sm:text-justify gap-4 max-w-150">
          <div className="text-2xl font-bold text-[#FFFFFF]">
            <h2>Olá,</h2>
            <h2>Sou o Dr. Alexsandro Araújo</h2>
          </div>
          <p className="text-[#EDF9FF] text-sm">Atuo na Medicina de Alta Performance, unindo saúde, exercício e ciência para ajudar cada pessoa a alcançar seu melhor potencial.
Acompanho atletas e praticantes de atividade física, além de pessoas que desejam iniciar uma rotina de exercícios, com foco em emagrecimento, composição corporal, performance, prevenção e tratamento de lesões, reabilitação e retorno ao esporte.
Meu propósito é proporcionar uma abordagem individualizada, segura e baseada em evidências, respeitando os objetivos e a realidade de cada paciente.</p>
        </div>
      </div>
    </section>
  )
}