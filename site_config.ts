export interface ISiteConfig {
	avatar: string;
	title: string;
	description: string;
	theme: {
		color: string;
	}
	links?: {
		website?: string,
		youtube?: string,
		bluesky?: string,
		twitter?: string,
		github?: string,
	}
}
export  const siteConfig:ISiteConfig = {
	avatar: "",
	title: "",
	description: "",
	theme: {
		color: "green"
	}
}