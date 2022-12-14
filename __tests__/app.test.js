const request = require("supertest");
const app = require("../app.js");
const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data/index");
const db = require("../db/connection.js");

beforeEach(() => {
  return seed(testData);
});

afterAll(() => db.end());

describe("/api/categories", () => {
  test("GET - 200: responds with an array of category objects, each of which should have properties: slug, description", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then(({ body }) => {
        expect(body.category).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              slug: expect.any(String),
              description: expect.any(String),
            }),
          ])
        );
      });
  });

  test("GET - 404: Invalid Path", () => {
    return request(app)
      .get("/api/categoriesbadurl")
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe("Invalid URL");
      });
  });
});

describe("/api/reviews", () => {
  test("GET - 200: responds with array of review objects", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        expect(body.review.length).toBeGreaterThan(0);
        body.review.forEach((review) => {
          expect(review).toEqual({
            owner: expect.any(String),
            title: expect.any(String),
            review_id: expect.any(Number),
            review_body: expect.any(String),
            category: expect.any(String),
            review_img_url: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            designer: expect.any(String),
            comment_count: expect.any(String),
          });
        });
      });
  });

  test("GET - 200: array of reviews sorted in descending order by date", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        expect(body.review).toBeSortedBy("created_at", { descending: true });
      });
  });
});

describe("/api/reviews/:review_id", () => {
  test("GET - 200: responds with a single matching review", () => {
    const idOfReview = 3;
    return request(app)
      .get(`/api/reviews/${idOfReview}`)
      .expect(200)
      .then(({ body }) => {
        // console.log(body);
        expect(body.review).toEqual(
          expect.objectContaining({
            review_id: idOfReview,
            title: "Ultimate Werewolf",
            review_body: "We couldn't find the werewolf!",
            designer: "Akihisa Okui",
            review_img_url:
              "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png",
            votes: 5,
            category: "social deduction",
            owner: "bainesface",
            created_at: "2021-01-18T10:01:41.251Z",
            comment_count: 3,
          })
        );
      });
  });

  test("GET - 404: ID does not exist", () => {
    return request(app)
      .get("/api/reviews/99999")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("ID 99999 does not exist");
      });
  });

  test("GET - 400: Invalid input", () => {
    return request(app)
      .get("/api/reviews/notID")
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
});

describe("/api/reviews/:review_id/comments", () => {
  test("GET - 200: responds with array of comments for given review_id, in descending order", () => {
    const idOfReview = 2;
    return request(app)
      .get(`/api/reviews/${idOfReview}/comments`)
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toBeSortedBy("created_at", { descending: true });
        expect(body.comments.length).toBeGreaterThan(0);
        body.comments.forEach((comment) => {
          expect(comment).toEqual(
            expect.objectContaining({
              review_id: idOfReview,
              author: expect.any(String),
              created_at: expect.any(String),
              votes: expect.any(Number),
              body: expect.any(String),
              comment_id: expect.any(Number),
            })
          );
        });
      });
  });

  test("GET - 200: empty array when there are no comments", () => {
    const idOfReview = 4;
    return request(app)
      .get(`/api/reviews/${idOfReview}/comments`)
      .expect(200)
      .then(({ body }) => {
        expect(body.comments).toEqual([]);
      });
  });

  test("GET - 400: Invalid input", () => {
    return request(app)
      .get(`/api/reviews/notID/comments`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });

  test("GET - 404: ID does not exist", () => {
    return request(app)
      .get("/api/reviews/99999/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("ID 99999 does not exist");
      });
  });
});

describe("POST/api/reviews/:review_id/comments", () => {
  test("POST - 201: responds with a comment added", () => {
    const newComment = {
      username: "mallionaire",
      body: "some text",
    };
    const reviewID = 4;
    return request(app)
      .post(`/api/reviews/${reviewID}/comments`)
      .send(newComment)
      .expect(201)
      .then(({ body }) => {
        expect(body.comment).toEqual(
          expect.objectContaining({
            comment_id: 7,
            author: "mallionaire",
            body: "some text",
          })
        );
      });
  });

  test("POST - 400: Empty username", () => {
    const newComment = {
      username: "",
      body: "some text",
    };
    const reviewID = 4;
    return request(app)
      .post(`/api/reviews/${reviewID}/comments`)
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Missing input");
      });
  });

  test("POST - 400: Empty body", () => {
    const newComment = {
      username: "mallionaire",
      body: "",
    };
    const reviewID = 4;
    return request(app)
      .post(`/api/reviews/${reviewID}/comments`)
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Missing input");
      });
  });

  test("POST - 400: Invalid username", () => {
    const newComment = {
      username: "someUser",
      body: "some text",
    };
    const reviewID = 4;
    return request(app)
      .post(`/api/reviews/${reviewID}/comments`)
      .send(newComment)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Username someUser does not exist");
      });
  });

  test("POST - 400: Invalid input", () => {
    return request(app)
      .post(`/api/reviews/notID/comments`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });

  test("POST - 404: ID does not exist", () => {
    return request(app)
      .post("/api/reviews/99999/comments")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("ID 99999 does not exist");
      });
  });
});

describe("PATCH/api/reviews/:review_id", () => {
  test("PATCH - 200: responds with updated review", () => {
    const newVote = 99;
    const reviewID = 2
    const inc_votes = { inc_votes: newVote };
    return request(app)
      .patch(`/api/reviews/${reviewID}`)
      .send(inc_votes)
      .expect(200)
      .then(({ body }) => {
        expect(body.vote).toEqual(
          expect.objectContaining({
            review_id: 2,
            votes: 104
          })
        );
      });
  });

  test("PATCH - 400: Missing input", () => {
    const inc_votes = {};
    const reviewID = 2;
    return request(app)
      .patch(`/api/reviews/${reviewID}`)
      .send(inc_votes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Missing input");
      });
  });

  test("PATCH - 400: Invalid input type", () => {
    const newVote = "some string";
    const inc_votes = { inc_votes: newVote} ;
    const reviewID = 2;
    return request(app)
      .patch(`/api/reviews/${reviewID}`)
      .send(inc_votes)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });

  test("PATCH - 404: ID does not exist", () => {
    return request(app)
      .patch("/api/reviews/99999")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("ID 99999 does not exist");
      });
  });

  test("PATCH - 400: Invalid input", () => {
    return request(app)
      .patch(`/api/reviews/notID`)
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
});

describe("/api/users", () => {
  test("GET - 200: responds with an array of users objects, each of which should have properties: username, name, avatar_url", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then(({ body }) => {
        expect(body.users).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              username: expect.any(String),
              name: expect.any(String),
              avatar_url: expect.any(String),
            }),
          ])
        );
      });
  });

  test("GET - 404: Invalid Path", () => {
    return request(app)
      .get("/api/usersbadurl")
      .expect(404)
      .then((res) => {
        expect(res.body.msg).toBe("Invalid URL");
      });
  });
});