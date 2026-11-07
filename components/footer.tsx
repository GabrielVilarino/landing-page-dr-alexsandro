import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contato">
      <div className="flex justify-between items-center gap-4 py-8 bg-[#ffefdc] px-8 md:px-16 lg:px-32 text-sm sm:text-md">
        <div className="flex flex-col gap-4">
          <h1 className="text-[#664e33] font-bold text-2xl">Contato</h1>
          <p className="text-[#664e33]">(11) 1234-5678</p>
          <p className="text-[#664e33]">dralexsandroaraujo@gmail.com</p>
          <p className="text-[#664e33]">Avenida Castelo Branco, n° 320, Bela Vista | Aracruz - ES</p>
        </div>
        <div className="flex flex-col justify-center items-center gap-4">
          <Link href="#">
            <Image
              src="/logo-2.png"
              alt="Logo"
              width={250}
              height={80}
              className="w-auto h-auto"
            />
          </Link>
          <div className="flex w-full justify-around">
            <Link href="https://www.instagram.com" target="_blank">
              <Image
                src="/instagram-v2.png"
                alt="instagram"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
            <Link href="https://www.facebook.com" target="_blank">
              <Image
                src="/facebook-v2.png"
                alt="facebook"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
            <Link href="https://www.whatsapp.com" target="_blank">
              <Image
                src="/whatsapp-v2.png"
                alt="whatsapp"
                width={30}
                height={30}
                className="transition duration-200 hover:brightness-50"
              />
            </Link>
          </div>
        </div>
      </div>
      <div className="w-full bg-[#664e33]">
        <p className="text-[#FFFFFF] py-1.5 px-8 md:px-16 lg:px-32 text-[10px] sm:text-sm">2026 © Dr. Alexsandro Araújo — Medicina de Alta Performance</p>
      </div>
    </footer>
  )
}