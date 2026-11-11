import PreAppointmentForm from "@/features/pre-appointments/components/pre-appointment-form";

export default function AgendamentoContainer() {
  return (
    <section
      id="agendamento"
      className="flex flex-col gap-4 py-8 bg-[#92714E] px-8 md:px-16 lg:px-32"
    >
      <h1 className="text-[#FFFFFF] font-bold text-2xl text-center">
        Agende sua consulta
      </h1>
      <PreAppointmentForm />
    </section>
  );
}
