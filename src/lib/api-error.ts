export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const statusMessages: Record<number, string> = {
  400: "Confira os dados informados.",
  401: "Sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "O registro não foi encontrado ou foi removido.",
  409: "Já existe um registro com esses dados.",
  500: "Não foi possível concluir a operação. Tente novamente.",
};

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message || statusMessages[error.status] || statusMessages[500];
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}
