const SUPADATA_API_KEY = 'sd_5ee59e52070e1004f4d3669e7438f472';

export const getTranscript = async (videoUrl: string): Promise<string> => {
  try {
    // Supadata expects the API key in the 'x-api-key' header, not as a query parameter.
    const url = `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(videoUrl)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Transcription failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.content) {
      // If content is an array (segments), extract text and join.
      if (Array.isArray(data.content)) {
        return data.content
            .map((item: any) => item.text)
            .filter((text: any) => typeof text === 'string')
            .join(' ');
      }
      // If content is already a string, return it.
      return String(data.content);
    } else {
      throw new Error("Transcript content not found in response.");
    }
  } catch (error: any) {
    console.error("Transcription Service Error:", error);
    throw new Error(error.message || "Failed to transcribe video.");
  }
};