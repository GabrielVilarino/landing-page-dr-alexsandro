import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AgendamentoForm() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent>
        <div className="flex flex-col gap-4 px-10">
          <Input placeholder="Nome" />
          <Input placeholder="Telefone" />
          <Input placeholder="E-mail" />
          <Textarea placeholder="Mensagem" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button className="px-10 py-5 bg-[#BF9462] hover:cursor-pointer hover:bg-[#92714E]">
          Enviar
        </Button>
      </CardFooter>
    </Card>
  );
}
