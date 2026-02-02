import Link from "next/link";
import {Button} from "@/emoji-ui/ui/Button"
import {
	Globe,
	Youtube,
	Twitter,
	Github,
	Mail, Linkedin,
} from "lucide-react"
import {BlueSky} from "@/components/BlueSky";

export default function () {

	return(
		<div className="flex flex-col gap-0.5">
			<Button
				variant={"link"}
			>
				<Link
					href={"https://youtube.com/@thewhitewitchtm"}
					target="_blank"
				>
					<Youtube className={"text-red-500"}/>
				</Link>
			</Button>
			<Button
				variant={"link"}
			>
				<Link
					href={"https://bsky.app/profile/thewhitewitchtm.sociallydead.me"}
					target="_blank"
				>
					<BlueSky className={"h-5 w-5 text-red-500"}/>
				</Link>
			</Button>
			<Button
				variant={"link"}
			>
				<Link
					href={"https://x.com/@thewhitewitchtm"}
					target="_blank"
				>
					<Twitter className={"text-red-500"}/>
				</Link>
			</Button>
			<Button
				variant={"link"}
			>
				<Link
					href={"https://github.com/TheWhiteWitchTM"}
					target="_blank"
				>
					<Github className={"text-red-500"}/>
				</Link>
			</Button>
			<Button
				variant={"link"}
			>
				<Link
					href={"mailto://thewhitewitchtm@gmail.com"}
					target="_blank"
				>
					<Mail className={"text-red-500"}/>
				</Link>
			</Button>
		</div>
	)
}