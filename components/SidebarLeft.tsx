import { Construction } from "lucide-react"
import Image from "next/image";
import Link from "next/link";
import BlueSkyLogin from "@/components/BlueSkyLogin";
import {BlueSky} from "@/components/BlueSky";
export default () => {
	return(
		<>
		<BlueSky/>
			<BlueSkyLogin>
				<div>
					After Login!
				</div>
			</BlueSkyLogin>
		</>
	)
}