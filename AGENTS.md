<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Desenvolvimento do frontend

## Stack e arquitetura

- Desenvolva com Next.js, App Router, React, TypeScript estrito e Tailwind CSS. Antes de alterar código relacionado ao Next.js, consulte a documentação correspondente em `node_modules/next/dist/docs/`; use `proxy.ts`, não o `middleware.ts` legado.
- É obrigatório utilizar shadcn/ui como base para componentes de interface. Reutilize e componha seus primitivos antes de criar um componente visual próprio; novos componentes compartilhados devem manter os padrões de API, acessibilidade e estilização do shadcn/ui.
- Mantenha as rotas em `src/app`. Use grupos de rota para organizar layouts sem alterar a URL pública. Páginas são `page.tsx`; layouts compartilhados são `layout.tsx`.
- Prefira Server Components. Inclua `"use client"` somente em componentes que precisam de estado, efeitos, eventos do navegador, React Hook Form ou hooks de navegação.
- Organize regras de negócio por feature em `src/features/<feature>/`:
  - `types/`: contratos TypeScript da API e da interface;
  - `schemas/`: schemas Zod, tipos inferidos e normalizadores/formatações;
  - `services/`: operações HTTP e adaptação de payloads;
  - `hooks/`: estado, carregamento, atualização e tratamento de falhas da feature;
  - `components/`: telas, formulários, cards e diálogos da feature.
- Coloque apenas elementos realmente reutilizáveis e independentes de domínio em `src/components/`; os primitivos de interface ficam em `src/components/ui/`. Use aliases configurados para imports internos.
- Preserve os componentes de interface compartilhados. Para composição de classes, use o utilitário `cn` do projeto.

## Formulários e validação

- Todo dado digitado pelo usuário deve ter um schema Zod em `src/features/<feature>/schemas`. O schema é a fonte de verdade para regras, limites, mensagens e o tipo do formulário, usando `z.infer`.
- Formulários devem usar `react-hook-form` com `zodResolver(schema)`, `defaultValues`, `handleSubmit` e `noValidate`. Não duplique validações manuais que o Zod pode expressar.
- Exiba erros por campo de forma acessível: associe `Label` e input por `htmlFor`/`id`, defina `aria-invalid`, use `aria-describedby` quando aplicável e mostre a mensagem retornada por `formState.errors`.
- Normalize dados antes de enviá-los no service (por exemplo, `trim`, remoção de máscara e conversão de valores). Não envie valores de apresentação diretamente para a API.
- Erros da API são diferentes dos erros de campo: mantenha-os em estado local e apresente-os com `role="alert"`. Desabilite ações repetidas durante `isSubmitting` e indique o carregamento.

## API, fetch e rewrite

- Use a API nativa `fetch`; não adicione bibliotecas de cliente HTTP. Centralize-a em um único módulo, por exemplo `src/lib/api-client.ts`, que exponha uma função tipada para todas as chamadas de negócio.
- O cliente centralizado deve: montar a URL pelo prefixo interno da API, configurar `Content-Type: application/json` quando o corpo não for `FormData`, enviar credenciais quando a autenticação for baseada em cookie, tratar `204 No Content`, interpretar respostas JSON quando presentes e lançar um erro tipado em respostas não bem-sucedidas.
- Cada service deve expor métodos pequenos, tipados e orientados ao recurso. Declare método HTTP, serialize corpos JSON com `JSON.stringify` e normalize os dados antes de enviá-los. Componentes e hooks não devem chamar `fetch` diretamente.
- Para envio de arquivos, envie `FormData` pelo cliente centralizado e nunca defina `Content-Type` manualmente: o navegador precisa incluir o boundary multipart.
- Trate falhas nos hooks ou componentes por uma função central de leitura de erro e apresente mensagens compreensíveis ao usuário.
- Configure um rewrite em `next.config.ts` para encaminhar um prefixo interno, como `/api/backend/:path*`, à URL do backend em variável de ambiente, preservando `:path*` na origem e no destino.
- Services devem chamar somente caminhos relativos após o prefixo interno, como `apiFetch("/v1/recurso")`. Não exponha a URL real do backend, hosts ou segredos ao cliente e não contorne o rewrite.
- Rewrites mascaram o destino e funcionam como proxy; não os substitua por redirect. Mudanças em `next.config.ts` exigem reiniciar o servidor de desenvolvimento.
- Use `cache: "no-store"` para dados autenticados ou mutáveis. Só adote cache ou revalidação com requisito explícito e semântica de dados definida.

## Autenticação, navegação e experiência

- Quando a autenticação usar cookie HTTP-only, o frontend não deve tentar lê-lo via JavaScript. Após login/logout, navegue com `router.replace(...)` e chame `router.refresh()` para atualizar o estado da rota.
- Proteja rotas no `src/proxy.ts` com um `matcher` limitado às áreas privadas. Mantenha a lógica do proxy mínima e evite transformá-lo em camada de autorização de negócio; a API é a fonte de permissão.
- Reutilize layouts e componentes compartilhados nas áreas privadas. Use `next/link` para navegação interna e `next/image` para imagens locais quando apropriado.
- Estados de carregamento, vazio, sucesso e erro devem ser explícitos. Evite telas silenciosas após uma falha e atualize os dados após mutações bem-sucedidas.
- Mantenha a interface responsiva, com foco visível, HTML semântico e feedback acessível. Prefira os tokens de design e padrões visuais definidos pela aplicação.

## Qualidade e manutenção

- Não use `any`; modele os contratos da API em `types/` e preserve o TypeScript estrito.
- Mantenha textos e mensagens da interface em português do Brasil e codificados em UTF-8.
- Consulte a documentação ou contrato da API antes de implementar ou mudar uma integração, confirmando método, URL, payload, permissão e códigos de resposta.
- Após alterações, execute ao menos `bun run lint`; execute `bun run build` quando a mudança atingir rotas, layouts, configuração do Next.js ou tipagem compartilhada.