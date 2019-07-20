import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Op, Model } from 'sequelize';
import User from '../models/User';

import Meetup from '../models/Meetup';

class MeetupController {
  async index(req, res) {
    const where = {};
    const page = req.query.page || 1;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      date: Yup.date().required(),
      banner_id: Yup.number().required(),
      location: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { date, location, description, banner_id } = req.body;

    /**
     * Check if the date is before
     */

    if (isBefore(parseISO(date), new Date())) {
      return res.status(401).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create({
      user_id: req.userId,
      description,
      location,
      date,
      banner_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      description: Yup.string().required(),
      date: Yup.date().required(),
      banner_id: Yup.number().required(),
      location: Yup.string().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;
    const meetup = await Meetup.findByPk(id);

    if (!meetup || meetup.past || meetup.user_id !== req.userId) {
      res.status(401).json({ error: 'Meetup can not be updated' });
    }

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;
    const meetup = await Meetup.findOne({
      where: {
        id,
        user_id: req.userId,
      },
    });

    if (!meetup) {
      return res.status(401).json({ error: "Meetup can't be canceled" });
    }

    await meetup.destroy();

    return res.status(200).send();
  }
}

export default new MeetupController();
