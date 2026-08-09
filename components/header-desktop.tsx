import Image from "next/image";
import Link from "next/link";

export default function HeaderDesktop() {
    return (
        <header className="hidden sm:block">
          <div className="flex justify-between items-center py-4 px-8 md:px-16 lg:px-32 bg-[#222222]">
            <Link href="#">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={250} 
                height={80}
              />
            </Link>
            <nav className="flex gap-4 text-[#E5E0DD]">
              <ul className="cursor-pointer hover:text-[#CFC9C5]">
                <Link href="#">
                  Home
                </Link>
              </ul>

              <ul className="cursor-pointer hover:text-[#CFC9C5]">
                <Link href="#apresentacao">
                  Sobre mim
                </Link>
              </ul>

              <ul className="cursor-pointer hover:text-[#CFC9C5]">
                <Link href="#contato">
                  Contato
                </Link>
              </ul>
            </nav>
          </div>
        </header>
    )
}