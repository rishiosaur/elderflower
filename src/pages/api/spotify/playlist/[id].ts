import { NextApiRequest, NextApiResponse } from "next";
import { spotify } from "../../../../modules/shared/services/spotify/access";
spotify;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const response = await spotify(
    `https://api.spotify.com/v1/playlists/${req.query.id}`
  );

  const json = await response.json();

  res.json(json);
};

export default handler;
