import AgendamentoContainer from "@/components/agendamento-container";
import ApresentacaoContainer from "@/components/apresentacao-container";
import DepoimentosContainer from "@/components/depoimentos-container";
import Footer from "@/components/footer";
import HeaderDesktop from "@/components/header-desktop";
import HeaderMobile from "@/components/header-mobile";
import HeroCarousel from "@/components/hero-carousel";
import ImageCarousel from "@/components/images-carousel";
import Localizacao from "@/components/localizacao";
import ServicoContainer from "@/components/servico-container";

export default function Home() {
  const imagesClinica = [
    "/clinica.png",
    "/clinica.png",
    "/clinica.png",
    "/clinica.png",
  ];
  return (
    <div>
      {/* Headers Desktop e Mobile */}
      <HeaderDesktop />
      <HeaderMobile />

      {/* Carrossel */}
      <HeroCarousel />

      {/* Serviços */}
      <ServicoContainer />

      {/* Apresentação */}
      <ApresentacaoContainer />

      {/* Depoimentos */}
      <DepoimentosContainer />

      {/* Carrossel Clinica */}
      <ImageCarousel images={imagesClinica} />

      {/* Localização */}
      <Localizacao />

      {/* Agendamento */}
      <AgendamentoContainer />

      {/* Footer */}
      <Footer />
    </div>
  );
}
