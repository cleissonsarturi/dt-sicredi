import {
  randomBytes,
  scrypt,
  type ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';

const PARAMETROS = { N: 16384, r: 8, p: 1 } as const;
const TAMANHO_CHAVE = 64;

function derivar(
  senha: string,
  salt: Buffer,
  opcoes: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(senha, salt, TAMANHO_CHAVE, opcoes, (erro, chave) =>
      erro ? reject(erro) : resolve(chave),
    ),
  );
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derivar(senha, salt, PARAMETROS);
  const { N, r, p } = PARAMETROS;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verificarSenha(
  senha: string,
  armazenado: string,
): Promise<boolean> {
  const [algoritmo, N, r, p, salt, hash] = armazenado.split('$');
  if (algoritmo !== 'scrypt' || !salt || !hash) return false;

  const esperado = Buffer.from(hash, 'base64');
  const calculado = await derivar(senha, Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return (
    calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  );
}
