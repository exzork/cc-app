import type {NextApiRequest, NextApiResponse} from 'next'
import {prisma} from "../../lib/prisma";

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
        case 'GET':
            const data = await prisma.data.findMany();
            res.status(200).json(data);
            break;
        case 'POST':
            const newData = await prisma.data.create({
                data: req.body
            });
            res.status(201).json(newData);
            break;
        default:
            res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}
