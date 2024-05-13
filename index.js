const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.port || 4444;
require('dotenv').config();

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dnxxphb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        const collection = client.db("assignmentHub").collection("assignments");
        const createdAssignments = client.db("assignmentHub").collection("created");
        const submittedCollections = client.db("assignmentHub").collection("submittedAssignments");

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


        app.get('/attemptedAssignments/:email', async (req, res) => {
            const submitter = req.params.email;
            const query = { submitter_email: submitter };
            const cursor = submittedCollections.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/pendingAssignments', async (req, res) => {
            const { status } = req.query;
            let query = {};
            if (status) {
                query = { status: status };
            }
            const cursor = submittedCollections.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/pendingAssignments/:id', async (req, res) => {
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

