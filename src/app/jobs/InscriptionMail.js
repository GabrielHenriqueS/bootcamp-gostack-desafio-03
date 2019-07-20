import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class InscriptionMail {
  get key() {
    return 'InscriptionMail';
  }

  async handle({ data }) {
    const { subscription } = data;

    await Mail.sendMail({
      to: `${subscription.User.name} <${subscription.User.email}>`,
      subject: 'Nova inscrição!',
      template: 'inscription',
      context: {
        user: subscription.User.name,
        meetup: subscription.Meetup.description,
        date: format(
          parseISO(subscription.Meetup.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
        location: subscription.Meetup.location,
      },
    });
  }
}
export default new InscriptionMail();
