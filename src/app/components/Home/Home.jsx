import { useRef, useState, useCallback } from 'react';
// import classes from './Home.module.css';

function App() {
  var v = useRef();
  var v1 = useRef();
  var [stream, setStream] = useState(null);

  const startRecordingStream = useCallback(async () => {
    const r = new MediaRecorder(stream);
    const mediaSource = new MediaSource();
    v1.current.src = URL.createObjectURL(mediaSource);
    var arrayOfBlobs = [];

    // fires every one second and passes an BlobEvent

    r.ondataavailable = async (event) => {
      // get the Blob from the event
      const blob = event.data; // get 1 sec blob of audio/video
      const firstUint8Arr = new Uint8Array(await blob.arrayBuffer()); // make blob array buffer, then Uint8Array
      const chunks = splitArr(firstUint8Arr); // divide the Uint8Array into numbered chunks
      const randomizedArr = randomizeArr(chunks); // currently randomizing chunk to ensure order doesn't matter. Later will be where data is sent
      const newU8Arr = joinArr(randomizedArr); // after receiving back randomly ordered numbered chunks, order chunks and convert to flattened Uint8Array

      arrayOfBlobs.push(newU8Arr.buffer);
      appendToSourceBuffer();
      // There's a 3 second delay but it looks like that's based on the timing of the event to play
      // here I need to connect the Blob back to the video feed
      console.log(blob, firstUint8Arr, chunks, randomizedArr, newU8Arr);
    };

    var sourceBuffer = null;
    mediaSource.addEventListener('sourceopen', function () {
      // NOTE: Browsers are VERY picky about the codec being EXACTLY
      // right here. Make sure you know which codecs you're using!
      sourceBuffer = mediaSource.addSourceBuffer(
        'video/webm; codecs="vp8, opus"'
      );
      // If we requested any video data prior to setting up the SourceBuffer,
      // we want to make sure we only append one blob at a time
      sourceBuffer.addEventListener('updateend', appendToSourceBuffer);
    });

    // 5. Use `SourceBuffer.appendBuffer()` to add all of your chunks to the video
    function appendToSourceBuffer() {
      console.log('here');
      if (
        mediaSource.readyState === 'open' &&
        sourceBuffer &&
        sourceBuffer.updating === false &&
        arrayOfBlobs.length > 0
      ) {
        if (Math.random() > 0.05) {
          sourceBuffer.appendBuffer(arrayOfBlobs.shift());
        } else {
          console.log('missed buffer');
        }
      }

      // Limit the total buffer size to 10 minutes // original 20 inutes at 1200
      // This way we don't run out of RAM
      if (
        v1.current.buffered.length &&
        v1.current.buffered.end(0) - v1.current.buffered.start(0) > 600
      ) {
        sourceBuffer.remove(0, v1.current.buffered.end(0) - 600);
      }
    }

    // make data available event fire every one second
    r.start(1000);
  }, [stream]);

  async function getStream() {
    const s = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    // v.current.srcObject = s;
    setStream(s);
  }

  function stopStream() {
    stream.getTracks().forEach((s) => s.stop());
    setStream(null);
  }

  function splitArr(u8Arr) {
    // separates the Uint8Array into chunks and stores them numerically
    let count = 1;
    const nChunks = 100;
    const chunks = [];
    for (let i = 0; i < u8Arr.length; i += Math.round(u8Arr.length / nChunks)) {
      chunks.push([
        count++,
        u8Arr.slice(i, i + Math.round(u8Arr.length / nChunks)),
      ]);
    }
    return chunks;
  }

  function randomizeArr(arr) {
    const newArr = [...arr];
    for (let i = 0; i < arr.length; i++) {
      const random = Math.floor(Math.random() * arr.length);
      [newArr[random], newArr[i]] = [newArr[i], newArr[random]];
    }

    return newArr;
  }

  function joinArr(arr) {
    return new Uint8Array(
      arr
        .sort((a, b) => a[0] - b[0])
        .map((a) => a[1])
        .reduce((acc, curr) => {
          acc.push(...curr);
          return acc;
        }, [])
    );
  }

  return (
    <>
      <button onClick={getStream}>Get Stream</button>
      <button onClick={startRecordingStream}>Start Chunking</button>
      <button onClick={stopStream}>Stop Stream</button>
      <video id="video1" autoPlay type="video/webm" ref={v}></video>
      <video id="video2" autoPlay type="video/webm" ref={v1}></video>
    </>
  );
}

export default App;
