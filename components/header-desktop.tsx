import Image from "next/image";
import Link from "next/link";

export default function HeaderDesktop() {
    return (
        <header className="hidden sm:block">
          <div className="flex justify-between items-center py-4 px-8 md:px-16 lg:px-32 bg-[#E5E0DD]">
            <Link href="#">
              <Image 
                src="/logo-1.png" 
                alt="Logo" 
                width={250} 
                height={80}
                className="w-auto h-auto"
              />
            </Link>
            <nav className="flex gap-4 text-[#9e8264] sm:text-xl">
              <ul className="cursor-pointer hover:text-[#876E53]">
                <Link href="#">
                  Home
                </Link>
              </ul>

              <ul className="cursor-pointer hover:text-[#876E53]">
                <Link href="#apresentacao">
                  Sobre mim
                </Link>
              </ul>

              <ul className="cursor-pointer hover:text-[#876E53]">
                <Link href="#contato">
                  Contato
                </Link>
              </ul>
            </nav>
          </div>
        </header>
    )
}