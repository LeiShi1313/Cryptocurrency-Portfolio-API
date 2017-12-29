/**
 * Created by DickyShi on 12/17/17.
 */
import {Router, Request, Response, NextFunction} from 'express';
const Heros = require("../data");

export class HeroRouter {
    router: Router

    constructor() {
        this.router = Router();
        this.init();
    }

    public getAll(req: Request, res: Response, next: NextFunction) {
        res.send(Heros);
    }

    public getOne(req: Request, res: Response, next: NextFunction) {
        let query = parseInt(req.params.id);
        let hero = Heros.find((hero: any) => hero.id === query);
        if (hero) {
            res.status(200)
                .send({
                    message: "Success",
                    status: res.status,
                    hero
                });
        } else {
            res.status(404)
                .send({
                    message: "No hero found with the given id",
                    status: res.status
                });
        }
    }

    init() {
        this.router.get('/', this.getAll);
        this.router.get('/:id', this.getOne);
    }
}

const heroRoutes = new HeroRouter();
heroRoutes.init();

export default heroRoutes.router;
