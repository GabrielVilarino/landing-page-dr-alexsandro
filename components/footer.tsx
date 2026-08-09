import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contato">
      <div className="flex justify-between items-center gap-4 py-8 bg-[#222222] px-8 md:px-16 lg:px-32 text-sm sm:text-md">
        <div className="flex flex-col gap-4">
          <h1 className="text-[#FFFFFF] font-bold text-2xl">Contato</h1>
          <p className="text-[#E5E0DD]">(11) 1234-5678</p>
          <p className="text-[#E5E0DD]">drviniciuscarlos@gmail.com</p>
          <p className="text-[#E5E0DD]">Avenida Castelo Branco, n° 320, Bela Vista | Aracruz - ES</p>
        </div>
        <div className="flex flex-col justify-center items-center gap-4">
          <Link href="#">
            <Image
              src="/logo2.png"
              alt="Logo"
              width={250}
              height={80} 
            />
          </Link>
          <div className="flex w-full justify-around">
            <Link href="https://www.instagram.com" target="_blank">
              <Image
                src="/instagram.png"
                alt="instagram"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
            <Link href="https://www.facebook.com" target="_blank">
              <Image
                src="/facebook.png"
                alt="facebook"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
            <Link href="https://www.whatsapp.com" target="_blank">
              <Image
                src="/whatsapp.png"
                alt="whatsapp"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#0F0F0F]">
        <p className="text-[#FFFFFF] py-1.5 px-8 md:px-16 lg:px-32 text-[10px] sm:text-sm">2026 © Dr. Alexsandro Araújo — Medicina de Alta Performance</p>
      </div>
    </footer>
  )
}