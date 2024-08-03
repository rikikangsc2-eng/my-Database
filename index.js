const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const scrap = require('@bochilteam/scraper');
const axios = require('axios');
const app = express();
const FormData = require('form-data');
const base = "https://nue-api.vercel.app";
const gis = require('g-i-s');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const { RsnChat } = require("rsnchat");
const Groq = require('groq-sdk');

const key = ['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','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','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','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']
const randomKey = key[Math.floor(Math.random() * key.length)];
const groq = new Groq({ apiKey: randomKey });
const rsnchat = new RsnChat("rsnai_SQPKHQEtlKlh8s9cjovGIiOp");

const userId = 'nueapi'; 
const ikyDBBaseUrl = 'https://copper-ambiguous-velvet.glitch.me';

const listapikey = ["8f62a0ea-cd83-4003-b809-6803bf9dd619","09c4a774-bf77-474a-b09b-45d63005160b","7e8ee357-c24c-450e-993b-ecc7458a6607","91eb053f-ae98-4baa-a2b0-1585f6199979","17a57da9-df4a-48c2-8d49-5bfc390174d2","6dc6600b-893a-4550-a980-a12c5f015288","4a465c34-f761-4de3-a9f8-b791ac7c5f43","cccdaf86-5e20-4b02-90cf-0e2dfa2ae19f"]

const apikey = () => {
  const randomIndex = Math.floor(Math.random() * listapikey.length);
  return listapikey[randomIndex];
};

async function readData() {
  try {
    const response = await axios.get(`${ikyDBBaseUrl}/read/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        today: 0,
        yesterday: 0,
        total: 0,
        lastDate: new Date().getDate()
      };
    }
    throw error;
  }
}

async function writeData(userId, data) {
  try {
    await axios.post(`${ikyDBBaseUrl}/write/${userId}`, {json:data});
  } catch (error) {
    throw error;
  }
}

//*
app.set('json spaces', 2);
app.get('/docs',function (req, res){
    res.redirect(base+'/docs')
})
app.get('/',async (req,res) =>{
    const response = await axios.get(base);
    res.send(response.data);
});
app.get('/count', async (req, res) => {
  try {
    let data = await readData();
    const currentDate = new Date().getDate();

    if (currentDate !== data.lastDate) {
      data.yesterday = data.today;
      data.today = 0;
      data.lastDate = currentDate;
    }

    data.today += 1;
    data.total += 1;

    await writeData(userId ,data);
    res.json(data);
  } catch (error) {
      console.error('Error reading data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/read', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/hasil.jpeg', express.static(path.join(__dirname, 'hasil.jpeg')));

app.get('/sdlist',async(req,res)=>{await sdList(res)})
app.get('/sdxllist',async(req,res)=>{await sdxlList(res)})

app.use(async (req, res, next) => {
  const { key } = req.query;
  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }
if (key === 'purpur') return next();
  try {
    const response = await axios.get('https://nue-api.vercel.app/key');
    const validKeys = response.data;

    const isValidKey = validKeys.some(validKey => validKey === key);

    if (isValidKey) {
      return next();
    } else {
      return res.status(401).json({ error: 'Silahkan gunakan endpoint utama karna key akan berubah ubah' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Ada kesalahan pada server kami' });
  }
});
//Router
app.get('/bard', async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).send('Masukkan parameter text');
  }

  try {
    const sistemResponse = await axios.get(`https://nue-api.vercel.app/sistem?text=${text}&user=bardo`);
    const { google_search, query_search } = sistemResponse.data;

    const fetchGoogleSearchResults = async () => {
      try {
        const { data } = await axios.get(`https://nue-api.vercel.app/api/google?limit=5&query=${query_search}`);
        return data.map(item => `${item.title}, ${item.snippet}, ${item.link}`).join('\n');
      } catch {
        return 'Tidak dapat mengambil hasil dari Google';
      }
    };

    const hs = google_search ? await fetchGoogleSearchResults() : null;

    const aiMessage = `*Gemini AI sedang memproses permintaan*
${hs ? 'Berhasil melakukan pencarian google, berikut hasilnya untuk membantu dalam menjawab pertanyaan pengguna: ' + hs : 'Google search tifak di aktifkan untuk pertanyaan ini'}

Anda harus menulis jawabannya untuk pengguna di sertai dengan penjelasan yang lengkap dan panjang`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Anda adalah Gemini, model bahasa besar yang dikembangkan oleh Google AI. Tujuan utama Anda adalah membantu pengguna dalam berbagai hal, seperti menjawab pertanyaan, memberikan informasi, dan menyelesaikan tugas. Anda masih dalam tahap pembelajaran, jadi semakin banyak Anda berinteraksi dengan pengguna, semakin baik kemampuan dan pengetahuan Anda. Intinya, Anda adalah AI yang bisa diajak ngobrol dan tanya-tanya. Anda dapat mencari informasi dan sudah terintegrasi dengan google search"
        },
        {
          role: "user",
          content: "Tolong bikinin outline postingan media sosial buat teman-temanku tentang program magang kuliahku"
        },
        {
          role: "assistant",
          content: `Tentu, ini beberapa outline postingan media sosial yang bisa kamu gunakan untuk membagikan pengalaman magangmu:
Opsi 1: Posting Singkat dan Menarik
 * Gambar: Foto kamu sedang bekerja di kantor magang atau sedang mengerjakan tugas.
 * Caption: "Seru banget jadi bagian dari [Nama Perusahaan] selama magang! ✨ Belajar banyak hal baru dan ketemu orang-orang hebat. Siapa tahu setelah ini bisa jadi alumni di sini?  #magang #[namajurusan] #[namaperusahaan]"
Opsi 2: Posting dengan Cerita Singkat
 * Gambar: Beberapa foto yang menggambarkan kegiatan magangmu (misal: meeting, presentasi, acara kantor).
 * Caption: "Minggu pertama magang udah seru banget! Dari belajar [skill 1] sampai presentasi di depan tim. Ternyata dunia kerja itu nggak seseram yang dibayangkan ya.  #maganglife #[namaperusahaan] #[kota]"
Opsi 3: Posting dengan Pertanyaan
 * Gambar: Foto kamu dengan latar belakang kantor atau sedang berdiskusi dengan mentor.
 * Caption: "Pernah nggak sih kepikiran mau magang di perusahaan seperti apa? Aku lagi senang banget bisa belajar banyak hal baru di [Nama Perusahaan]. Siapa di sini yang juga lagi magang? Share pengalamanmu yuk!  #magang #[namajurusan] #[pertanyaan tentang magang]"
Opsi 4: Posting dengan Quote
 * Gambar: Quote motivasi tentang magang atau bekerja.
 * Caption: "Quote kesukaan selama magang: '[Quote]'.  Setuju nggak?   #magang #[namaperusahaan] #[quote]"
Tips Tambahan:
 * Gunakan hashtag yang relevan: Selain hashtag yang sudah disebutkan, kamu bisa menambahkan hashtag seperti #studentlife, #internship, #[namakampus], dll.
 * Tag akun perusahaan: Tag akun media sosial perusahaan tempat kamu magang agar postinganmu lebih mudah dilihat oleh mereka.
 * Ajak teman-teman untuk bertanya: Buat sesi tanya jawab di kolom komentar untuk membuat interaksi yang lebih seru.
Contoh Outline Cerita Instagram:
 * Slide 1: Foto kamu dengan seragam kantor. Caption: "Hari pertama magang! ✨"
 * Slide 2: Foto kamu sedang mengerjakan tugas. Caption: "Belajar banyak hal baru setiap hari. "
 * Slide 3: Foto bersama tim magang. Caption: "Senang bisa kenal teman-teman baru. "
 * Slide 4: Foto suasana kantor. Caption: "Suasana kerja yang nyaman dan menyenangkan. "
 * Slide 5: Foto kamu tersenyum. Caption: "Siap menghadapi tantangan baru! "
Ingin lebih banyak ide? Beritahu aku tentang hal-hal menarik yang kamu alami selama magang, aku bisa bantu buat postingan yang lebih spesifik.
Pilihan lain: Kamu juga bisa membuat konten video singkat seperti Reels atau TikTok untuk membagikan pengalaman magangmu dengan cara yang lebih kreatif.
Semoga outline ini membantumu ya!`
        },
        {
          role: "user",
          content: text
        },
        {
          role: "system",
          content: aiMessage
        }
      ],
      model: "gemma2-9b-it",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
      stop: null
    });

    res.status(200).send({
      endpoint: `${base}/api/bard?text=${text}`,
      result: chatCompletion.choices[0].message.content.trim()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/nuego', async (req, res) => {
  const versionAI = '1.0.5'
  const versionSistem = '1.0.0.5'
  const { user, q } = req.query;

  if (!q || !user) {
    return res.status(400).send('Masukkan parameter q dan user');
  }

  try {
    const sistemResponse = await axios.get(`https://nue-api.vercel.app/sistem?text=${q}&user=${user}${versionSistem}`);
    const { text, google_search, query_search } = sistemResponse.data;

    const fetchGoogleSearchResults = async () => {
      try {
        const { data } = await axios.get(`https://nue-api.vercel.app/api/google?limit=5&query=${query_search}`);
        return data.map(item => `${item.title}, ${item.snippet}, ${item.link}`).join('\n');
      } catch {
        return 'Tidak dapat mengambil hasil dari Google';
      }
    };

    const hs = google_search ? await fetchGoogleSearchResults() : null;

    const aiMessage = `*memproses permintaan*
${hs ? 'Berhasil melakukan pencarian google, berikut hasilnya untuk membantu dalam menjawab pertanyaan pengguna: ' + hs : ''}

Anda harus menulis jawabannya untuk pengguna`;

    const response = await axios.get('https://nue-api.vercel.app/api/lgpt', {
      params: {
        text: text,
        systemPrompt: `Anda adalah AI bernama nueGo anda adalah AI lanjutan buatan NueAPI dan memiliki API di nue-api.vercel.app, Anda dapat mencari informasi dan sudah terintegrasi dengan google search`,
        aiMessage: aiMessage,
        user: `${user}${versionAI}`
      }
    });

    res.status(200).send({
      endpoint: `${base}/api/nuego?q=${q}&user=${user}`,
      google: google_search,
      result: query_search? `> ${query_search}\n${response.data.result}`:response.data.result,
      history: response.data.history
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/diff', async (req, res) => {
  const preset = req.query.preset;
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    res.status(400).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
        data: {
    width: 1024,
    height: 1024,
    sampler: 'DPM++ 2M Karras',
    upscale: true,
    seed: -1,
    cfg_scale: 7,
    steps: 20,
    style_preset: preset,
    prompt: prompt,
    model: model}

    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/diffpreset?model=${model}&preset=${preset}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
      res.status(500).json({ error: error.message });
  }
});
app.get('/sdxl', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    return res.status(500).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sdxl/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        width: 1024,
        height: 1024,
        sampler: 'DPM++ 2M Karras',
        upscale: true,
        seed: -1,
        cfg_scale: 7,
        steps: 20,
        model: model,
        prompt: prompt
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/sdxl?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/text2img', async (req, res) => {
  const model = req.query.model;
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send('Prompt parameter is required');
  }
  if (!model) {
    return res.status(500).json({ error: 'Model parameter is required' });
  }

  try {
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/sd/generate',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        width: 1024,
        height: 1024,
        sampler: 'DPM++ 2M Karras',
        upscale: true,
        seed: -1,
        cfg_scale: 7,
        steps: 20,
        model: model,
        prompt: prompt
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/text2img?model=${model}&prompt=${encodeURIComponent(prompt)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/upscale', async (req, res) => {
  const link = req.query.url;
  if (!link) {
    return res.status(400).send('URL parameter is required');
  }

  try {
    const response = await axios.get(link, { responseType: 'arraybuffer' });
    fs.writeFileSync('hasil.jpeg', response.data);
    const imageData = await axios.get(`https://nue-api.koyeb.app/hasil.jpeg`, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageData.data).toString('base64');
    const options = {
      method: 'POST',
      url: 'https://api.prodia.com/v1/upscale',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Prodia-Key': apikey()
      },
      data: {
        resize: 2, 
        model: 'SwinIR 4x',
        imageData: base64Image
      }
    };

    const apiResponse = await axios(options);
    const data = apiResponse.data;

    let data2;
    let status = 'pending';

    while (status !== 'succeeded') {
      const options2 = {
        method: 'GET',
        url: `https://api.prodia.com/v1/job/${data.job}`,
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': apikey()
        }
      };

      const response2 = await axios.request(options2);
      data2 = response2.data;
      status = data2.status;

      if (status !== 'succeeded') {
        console.log(`Current status: ${status}. Waiting for 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    const json = { endpoint: `${base}/api/upscale?url=${encodeURIComponent(link)}`, data: data2 };
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/image', async (req, res) => {
  const query = req.query.query;

  try {
    const results = await new Promise((resolve, reject) => {
      gis(query, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });

    const urls = results
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
      .slice(0, 10)
      .map(result => result.url);

    if (urls.length > 0) {
      const json = {
          endpoint:base+"/api/image?query="+encodeURIComponent(query),
          rekomendasi: urls[0], result: urls };
      res.status(200).json(json);
    } else {
      res.status(404).json({ error: 'No images found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({error:error.message});
  }
});

app.get('/gemini', async (req, res) => {
  try {
    if (!req.query.prompt) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const response = await rsnchat.gemini(req.query.prompt);

    const json = {endpoint:base+"/api/gemini?prompt="+encodeURIComponent(req.query.prompt),status : 200, result : response.message.replace(/\*\*/g, "*")}
      res.status(200).json(json);
  } catch (error) {
      console.error(error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/gpt', async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).send('Model and prompt query parameters are required');
    }

    try {
        const response = await rsnchat.gpt(prompt)
        const json = {endpoint:base+'/api/gpt?prompt='+encodeURIComponent(prompt),status:200, result:response.message}
        res.status(200).json(json);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
});

app.get('/snapsave', async (req, res) => {
  try {
    // Check if URL parameter is present
    if (!req.query.url) {
      return res.status(400).json({
        status: 400,
        message: "Masukkan parameter url"
      });
    }

    // Scrape data from the provided URL
    let hasil = await scrap.snapsave(req.query.url);
      hasil = hasil.results;
    if (!hasil.length) {
      return res.status(404).json({
        status: 404,
        message: "No data found for the provided URL"
      });
    }

    // Get content type from the first result URL
    const response = await axios.head(hasil[0].url);
    let type = 'video';
    if (response.headers['content-type'].includes('image')) {
      type = 'image';
    } else if (response.headers['content-type'].includes('video')) {
      type = 'video';
    }

    // Construct and send the response
    const json = {
      endpoint: `${base}/api/snapsave?url=${encodeURIComponent(req.query.url)}`,
      status: 200,
      type,
      result: hasil
    };

    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/yt-mp3', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(url, { filter : 'audioonly' }).pipe(res);
});

app.get('/yt-mp4', async (req, res) => {
    let url = req.query.url;
    if (!ytdl.validateURL(url)) {
        return res.status(400).send('URL tidak valid');
    }
    res.header('Content-Disposition', `attachment; filename="NueApi ${Date.now()}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { filter: 'videoandaudio' }).pipe(res);
});

const sdList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sd/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion</h1>

      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <div class="mb-3">
              <label for="type" class="form-label">Type</label>
              <select class="form-select" id="type" required>
                  <option value="" disabled selected>Select type</option>
                  <option value="text2img">Stable Diffusion</option>
                  <option value="diffpreset">Preset Diffusion</option>
              </select>
          </div>
          <div class="mb-3" id="presetDiv" style="display:none;">
              <label for="preset" class="form-label">Preset</label>
              <select class="form-select" id="preset">
                  <option value="" disabled selected>Select preset</option>
                  <option value="enhance">Enhance</option>
                  <option value="fantasy-art">Fantasy Art</option>
                  <option value="isometric">Isometric</option>
                  <option value="line-art">Line Art</option>
                  <option value="low-poly">Low Poly</option>
                  <option value="neon-punk">Neon Punk</option>
                  <option value="origami">Origami</option>
                  <option value="photographic">Photographic</option>
                  <option value="pixel-art">Pixel Art</option>
                  <option value="texture">Texture</option>
                  <option value="craft-clay">Craft Clay</option>
                  <option value="3d-model">3D Model</option>
                  <option value="analog-film">Analog Film</option>
                  <option value="anime">Anime</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="comic-book">Comic Book</option>
                  <option value="digital-art">Digital Art</option>
              </select>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          if (type === "diffpreset") {
              if (model && prompt && type && preset) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          } else {
              if (model && prompt && type) {
                  $('#goButton').prop('disabled', false);
                  $('#exDiffusion').attr('href', \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`);
              } else {
                  $('#goButton').prop('disabled', true);
              }
          }
      }

      $('#model, #prompt, #type, #preset').on('input', updateLink);

      $('#type').on('change', function() {
          if ($(this).val() === 'diffpreset') {
              $('#presetDiv').show();
          } else {
              $('#presetDiv').hide();
          }
          updateLink();
      });

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          const type = $('#type').val();
          const preset = $('#preset').val();
          let url = '';
          if (type === 'diffpreset') {
              url = \`https://nue-api.vercel.app/api/diffpreset?model=\${model}&prompt=\${prompt}&preset=\${preset}\`;
          } else {
              url = \`https://nue-api.vercel.app/api/\${type}?model=\${model}&prompt=\${prompt}\`;
          }
          if (url) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = url;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};

const sdxlList = async (res) => {
    const options = {
        method: 'GET',
        url: 'https://api.prodia.com/v1/sdxl/models',
        headers: {
            accept: 'application/json',
            'X-Prodia-Key': apikey()
        }
    };

    axios
        .request(options)
        .then(function (response) {
            const formattedResponse = response.data.map(item => `<li>${item}</li>`).join('');
            const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Model List</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
  <style>
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #121212;
          color: #e0e0e0;
      }
      .container {
          padding: 20px;
          max-width: 800px;
          margin: auto;
      }
      h1, h2 {
          text-align: center;
          margin-bottom: 20px;
      }
      ul {
          list-style-type: none;
          padding: 0;
      }
      li {
          background: #1e1e1e;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      button {
          background: #ff6f61;
          border: none;
          padding: 10px;
          border-radius: 5px;
          color: white;
          cursor: pointer;
      }
      button:hover {
          background: #ff3b2e;
      }
      .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
      }
      .spinner-border {
          width: 3rem;
          height: 3rem;
      }
      #loading {
          display: none;
      }
      @media (max-width: 600px) {
          h1, h2 {
              font-size: 1.5rem;
          }
          button {
              padding: 5px;
          }
      }
  </style>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
  <div id="loading" class="overlay">
      <div>
          <div class="spinner-border" role="status">
              <span class="visually-hidden">⌛</span>
          </div>
          <p>Jangan keluar dari halaman, loading paling lama 30 detik</p>
      </div>
  </div>
  <div class="container">
      <h1>List Model Stable Diffusion XL</h1>
      <p class="lead"></p>
      <form id="inputForm" class="mt-4">
          <div class="mb-3">
              <label for="model" class="form-label">Model</label>
              <input type="text" class="form-control" id="model" required>
          </div>
          <div class="mb-3">
              <label for="prompt" class="form-label">Prompt</label>
              <input type="text" class="form-control" id="prompt" required>
          </div>
          <button type="button" id="goButton" class="btn btn-primary" disabled>Go</button>
      </form>
      <ul class="mt-4">
          ${formattedResponse}
      </ul>
      <button id="copyAllButton" class="btn btn-secondary">Copy All</button>
  </div>
  <script>
      function copyToClipboard(text) {
          navigator.clipboard.writeText(text);
          alert('Copied to clipboard');
      }

      function updateLink() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#goButton').prop('disabled', false);
              $('#exExample').attr('href', \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`);
          } else {
              $('#goButton').prop('disabled', true);
          }
      }

      $('#model, #prompt').on('input', updateLink);

      $('#goButton').on('click', function() {
          const model = $('#model').val().trim();
          const prompt = $('#prompt').val().trim();
          if (model && prompt) {
              $('#loading').show();
              $('body').css('overflow', 'hidden');
              setTimeout(() => {
                  window.location.href = \`https://nue-api.vercel.app/api/sdxl?model=\${model}&prompt=\${prompt}\`;
              }, 1000); // Simulating a delay for loading spinner visibility
          }
      });

      $('#copyAllButton').on('click', function() {
          const items = ${JSON.stringify(response.data)};
          copyToClipboard(JSON.stringify(items));
      });
  </script>
</body>
</html>
`;
            res.send(htmlResponse);
        })
        .catch(function (error) {
            res.send("Error fetching list");
        });
};



app.listen(8000, () => {
console.log("Berjalan di port 8000")
});
