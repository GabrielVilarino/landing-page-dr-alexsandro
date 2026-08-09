export default function Localizacao() {
  return (
    <section className="bg-[#E5E0DD] px-8 py-10">
      <h2 className="mb-5 text-center text-base font-bold text-[#92714E]">
        Localização
      </h2>

      <div className="mx-auto max-w-175 overflow-hidden">
        <iframe
          src="https://www.google.com/maps?q=-2.504250610275579,-44.2642130311796&output=embed"
          className="h-75 w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="mx-auto mt-3 max-w-175 text-left text-xs text-[#92714E]">
        Avenida Castelo Branco, nº 320, Bela Vista | Aracruz - ES
      </p>
    </section>
  );
}