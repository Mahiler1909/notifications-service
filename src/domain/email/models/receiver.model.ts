export class Receiver {
  constructor(public readonly email: string, public readonly name: string) {
    if (!email || !email.includes('@')) {
      throw new Error(`Invalid email: ${email}`);
    }
    if (!name.trim()) {
      throw new Error('Receiver name cannot be empty');
    }
  }
}
