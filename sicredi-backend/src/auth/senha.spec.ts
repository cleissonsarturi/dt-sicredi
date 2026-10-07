import { gerarHashSenha, verificarSenha } from './senha.js';

describe('senha', () => {
  it('aceita a senha correta e recusa uma diferente', async () => {
    const hash = await gerarHashSenha('Senha@Teste123');

    await expect(verificarSenha('Senha@Teste123', hash)).resolves.toBe(true);
    await expect(verificarSenha('senha@teste123', hash)).resolves.toBe(false);
  });

  it('não armazena a senha em texto e usa salt aleatório', async () => {
    const [a, b] = await Promise.all([
      gerarHashSenha('mesma-senha'),
      gerarHashSenha('mesma-senha'),
    ]);

    expect(a).toMatch(/^scrypt\$\d+\$\d+\$\d+\$/);
    expect(a).not.toContain('mesma-senha');
    expect(a).not.toBe(b);
  });

  it('recusa hash em formato desconhecido', async () => {
    await expect(verificarSenha('qualquer', 'texto-puro')).resolves.toBe(false);
  });
});
