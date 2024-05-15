const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const cors = require('cors')
const app = express()
const port = process.env.port || 4444;
require('dotenv').config();

app.use(cors({
    origin:
        [
            'http://localhost:5173',
            'https://assignment-hub-e4e39.web.app',
            'https://assignment-hub-e4e39.firebaseapp.com'
        ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dnxxphb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const logger = (req, res, next) => {
    console.log('log:info ', req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log("token in the middleware", token)
    if (!token) {
        return res.status(401).send({ message: 'ja beta Unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.user = decoded;
        next();
    })
    // next(.);
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const collection = client.db("assignmentHub").collection("assignments");
        const createdAssignments = client.db("assignmentHub").collection("created");
        const submittedCollections = client.db("assignmentHub").collection("submittedAssignments");

        //jwt api

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log("user token", user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log(user);
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 0  // Setting maxAge to 0 to expire the cookie immediately
            }).send({ success: true });
        });

        app.get('/assignments', async (req, res) => {
            const cursor = collection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/allAssignments', async (req, res) => {
            const { difficulty } = req.query;
            let query = {};
            if (difficulty) {
                query = { difficulty_level: difficulty };
            }
            const cursor = createdAssignments.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/allAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await createdAssignments.findOne(query);
            res.send(result);
        })
        app.post('/allAssignments', async (req, res) => {
            const newitem = req.body;
            const result = await createdAssignments.insertOne(newitem);
            res.send(result);
        })

        app.delete('/allAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await createdAssignments.deleteOne(query);
            res.send(result);
        })
        app.put('/allAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const assignment = req.body;
            const updatedItem = {
                $set: {
                    title: assignment?.title,
                    marks: assignment?.marks,
                    description: assignment?.description,
                    thumbnail_url: assignment?.thumbnail_url,
                    difficulty_level: assignment?.difficulty_level,
                    due_date: assignment?.due_date,
                    status: assignment?.status,
                    obtained_mark: assignment?.obtained_mark,
                    submitter_email: assignment?.submitter_email
                },
            };
            const result = await createdAssignments.updateOne(query, updatedItem, options);
            res.send(result);
        })


        //submitted assignments

        app.get('/attemptedAssignments', async (req, res) => {
            const cursor = submittedCollections.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/attemptedAssignments', async (req, res) => {
            const newitem = req.body;
            const result = await submittedCollections.insertOne(newitem);
            res.send(result);
        })


        app.get('/attemptedAssignments/:email', verifyToken, logger, async (req, res) => {

            console.log(req.params.email)
            console.log("token owner info", req.user.email)
            if (req.user.email !== req.params.email) {

                return res.status(403).send({ message: 'forbidden access' })

            }
            const submitter = req.params.email;
            const query = { submitter_email: submitter };
            const cursor = submittedCollections.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/pendingAssignments', verifyToken, logger, async (req, res) => {
            const { status } = req.query;
            let query = {};
            if (status) {
                query = { status: status };
            }
            const cursor = submittedCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/pendingAssignments/:id', verifyToken, logger, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await submittedCollections.findOne(query);
            res.send(result);
        })
        app.put('/pendingAssignments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const assignment = req.body;
            const updatedItem = {
                $set: {
                    status: assignment?.status,
                    obtained_mark: assignment?.obtained_mark,
                    feedback: assignment?.feedback,
                },
            };
            const result = await submittedCollections.updateOne(query, updatedItem, options);
            res.send(result);
        })
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

