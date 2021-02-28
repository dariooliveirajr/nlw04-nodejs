import request from 'supertest';
import { getConnection } from 'typeorm';
import { app } from '../app';

import createConnection from '../database'

var mockUser;
var mockSurvey;
var mockUserSurvey;

describe.only("Answers", () => {
    beforeAll(async () => {
        const connection = await createConnection();
        await connection.runMigrations();

        //Creating a user for tests
        var userExample = await request(app).post("/users").send({
            email: "user@example.com",
            name: "User Example"
        });
        mockUser = userExample.body;

        //Creating a survey for tests
        var surveyExample = await request(app).post("/surveys").send({
            title: "Title Example",
            description: "Description Example"
        });
        mockSurvey = surveyExample.body;
    });

    afterAll(async () => {
        const connection = getConnection();
        await connection.dropDatabase();
        await connection.close();
    });

    it("Should be able to create a new userSurvey with a pending response", async () => {
        const response = await request(app).post("/sendMail").send({
            email: mockUser.email,
            survey_id: mockSurvey.id,
            test: true
        });

        mockUserSurvey = response.body;

        expect(response.status).toBe(200);
        expect(response.body.user_id).toEqual(mockUser.id);
        expect(response.body.survey_id).toEqual(mockSurvey.id);
        expect(response.body.value).toBeUndefined();
    });

    it("Should be able to save the user rating response on the database", async () => {

        const response = await request(app).get(`/answers/10?u=${mockUserSurvey.id}`);

        expect(response.status).toBe(200);
        expect(response.body.value).toEqual(10);
    });

    it("Should be able to return the survey NPS", async () => {

        const response = await request(app).get(`/nps/${mockSurvey.id}`);

        expect(response.status).toBe(200);
        expect(response.body.detractor).toBeGreaterThanOrEqual(0);
        expect(response.body.promoters).toBeGreaterThanOrEqual(0);
        expect(response.body.passive).toBeGreaterThanOrEqual(0);
        expect(response.body.totalAnswers).toBeGreaterThanOrEqual(0);
        expect(response.body.nps).toBeGreaterThanOrEqual(0);
    });
});