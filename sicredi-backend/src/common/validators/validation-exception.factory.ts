import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

type Tradutor = (campo: string, limite?: string) => string;

/** Mensagens padrão do class-validator traduzidas para pt-BR. */
const TRADUCOES: Record<string, Tradutor> = {
  isString: (c) => `${c} deve ser um texto`,
  isNotEmpty: (c) => `${c} é obrigatório`,
  minLength: (c, n) => `${c} deve ter no mínimo ${n} caracteres`,
  maxLength: (c, n) => `${c} deve ter no máximo ${n} caracteres`,
  isInt: (c) => `${c} deve ser um número inteiro`,
  min: (c, n) => `${c} deve ser maior ou igual a ${n}`,
  max: (c, n) => `${c} deve ser menor ou igual a ${n}`,
  isEnum: (c) => `${c} possui um valor inválido`,
  isIn: (c) => `${c} possui um valor inválido`,
  whitelistValidation: (c) => `${c} não é um campo permitido`,
};

const ehMensagemPadrao = (mensagem: string) =>
  /\b(must|should)\b/.test(mensagem);

function traduzir(erro: ValidationError, prefixo = ''): string[] {
  const campo = prefixo + erro.property;
  const filhos = (erro.children ?? []).flatMap((f) => traduzir(f, `${campo}.`));
  const restricoes = Object.entries(erro.constraints ?? {});
  if (restricoes.length === 0) return filhos;

  if (erro.value === undefined || erro.value === null) {
    const personalizada = restricoes.find(([, m]) => !ehMensagemPadrao(m));
    return [personalizada?.[1] ?? `${campo} é obrigatório`];
  }

  const [regra, mensagem] = restricoes[0];
  const tradutor = TRADUCOES[regra];
  if (!tradutor || !ehMensagemPadrao(mensagem)) return [mensagem];
  return [tradutor(campo, mensagem.match(/\d+/)?.[0])];
}

export function validationExceptionFactory(erros: ValidationError[]) {
  return new BadRequestException(erros.flatMap((e) => traduzir(e)));
}
