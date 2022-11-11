// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const functions = require('firebase-functions');
const {SpeechClient} = require('@google-cloud/speech');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const speechToTextClient = new SpeechClient();
initializeApp({
    credential: applicationDefault()
  });
  
const db = getFirestore();
exports.speechText = functions.https.onRequest(
    async (request, response) => {
      const responseBody = {};
  
      try {
        await validateRequest(request);
  
        const inputEncoding = request.body.encoding;
        const inputSampleRateHertz = request.body.sampleRateHertz;
        const inputLanguageCode = request.body.languageCode;
        const inputAudioContent = request.body.audioContent;
  
        console.log(`Input encoding: ${inputEncoding}`);
        console.log(`Input sample rate hertz: ${inputSampleRateHertz}`);
        console.log(`Input language code: ${inputLanguageCode}`);
  
        // [START chain_cloud_calls]
        const [sttResponse] = await callSpeechToText(
          inputAudioContent,
          inputEncoding,
          inputSampleRateHertz,
          inputLanguageCode
        );
  
        // The data object contains one or more recognition
        // alternatives ordered by accuracy.
        const transcription = sttResponse.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
        const data = {
            value: transcription,
            timestamp: new Date().toISOString()
        }
        const res = await db.collection('speeches').add(data);
        console.log('Added document with ID: ', res.id);
        responseBody.transcription = transcription;
        console.log(`Response: ${JSON.stringify(responseBody)}`);
        response.status(200).send(responseBody);
      } catch (error) {
        console.error(error);
        response.status(400).send(error.message);
      }
    }
  );

const callSpeechToText = (
    audioContent,
    encoding,
    sampleRateHertz,
    languageCode
  ) => {
    console.log(`Processing speech from audio content in ${languageCode}.`);
  
    const request = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
      },
      audio: {content: audioContent},
    };
  
    return speechToTextClient.recognize(request);
  };

  const validateRequest = request => {
    return new Promise((resolve, reject) => {
      if (!request.body.encoding) {
        reject(new Error('Invalid encoding.'));
      }
      if (!request.body.sampleRateHertz || isNaN(request.body.sampleRateHertz)) {
        reject(new Error('Sample rate hertz must be numeric.'));
      }
      if (!request.body.languageCode) {
        reject(new Error('Invalid language code.'));
      }
      if (!request.body.audioContent) {
        reject(new Error('Invalid audio content.'));
      }
  
      resolve();
    });
  };