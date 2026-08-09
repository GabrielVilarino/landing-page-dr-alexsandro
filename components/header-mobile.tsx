"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HeaderMobile() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sm:hidden">
      <div className="flex justify-between items-center py-4 px-8 md:px-16 lg:px-32 bg-[#222222]">
        <Link href="#">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={180} 
            height={80}
          />
        </Link>
        <div className="flex flex-col gap-4">
          <Image 
            src="/menu-mobile.png"
            alt="Menu"
            width={30}
            height={30}
            onClick={() => setOpen(!open)}
          />
          <div className={`${
              open ? "flex" : "hidden"
            } absolute top-20 left-0 w-full flex-col gap-4 bg-[#222222] shadow-lg z-100`}
          >
            <nav className="flex flex-col text-[#E5E0DD] text-center">
              <ul className="cursor-pointer px-4 py-2 hover:text-[#CFC9C5] border-t-[0.1px] border-[#E5E0DD]">
                  Home
              </ul>

              <ul className="cursor-pointer px-2 py-2 hover:text-[#CFC9C5] border-t-[0.1px] border-[#E5E0DD]">
                  Sobre mim
              </ul>

              <ul className="cursor-pointer px-4 py-2 hover:text-[#CFC9C5] border-t-[0.1px] border-[#E5E0DD]">
                  Contato
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}