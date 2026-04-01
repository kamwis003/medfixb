import { IHelloService } from './interfaces/i-hello-service'

export const helloService: IHelloService = {
  getHelloMessage(): string {
    return 'Hello from the service layer! Your architecture is working!'
  },
}
