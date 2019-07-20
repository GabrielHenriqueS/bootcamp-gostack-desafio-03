import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';

import {Op} from 'sequelize';

import Queue from '../../lib/Queue';
import InscriptionMail from '../jobs/InscriptionMail';

class SubsCriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });
    return res.json(subscriptions);
  }

  async store(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId);

    if (!meetup) {
      return res
        .status(400)
        .json({ error: "Can't possible subscrible in meetup" });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }

    const availableMeetup = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (availableMeetup) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscrip = await Subscription.create({
      meetup_id: meetupId,
      user_id: req.userId,
    });

    const subscription = await Subscription.findByPk(subscrip.id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
        {
          model: Meetup,
          attributes: ['date', 'location', 'description'],
        },
      ],
    });

    await Queue.add(InscriptionMail.key, {
      subscription,
    });

    return res.json(subscrip);
  }
}

export default new SubsCriptionController();
