import { NextApiRequest, NextApiResponse } from "next";
import {
  baseSpotifyApi,
  spotify,
} from "../../../modules/shared/services/spotify/access";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const response = await spotify(
    "https://api.spotify.com/v1/me/player/currently-playing"
  );

  const json = await response.json();

  res.json(json);
};

export default handler;
