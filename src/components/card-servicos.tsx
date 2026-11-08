import Image from "next/image";

type CardServicosProps = {
  image: string;
  title: string;
  description: string;
};

export default function CardServicos({
  image,
  title,
  description,
}: CardServicosProps) {
  return (
    <div className="bg-white w-[250] h-[250] rounded-lg shadow-lg p-4 flex flex-col items-center justify-center">
      <Image
        src={image}
        alt={title}
        width={35}
        height={35}
        className="w-8.75 h-8.75"
      />

      <h2 className="text-[#92714E] font-bold text-md mt-2 mb-2">{title}</h2>
      <p className="text-[#92714E] text-center">{description}</p>
    </div>
  );
}
