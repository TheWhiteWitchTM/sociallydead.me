import { Construction } from "lucide-react"
import Image from "next/image";
import Link from "next/link";

export default () => {
	return(
	<div className={"flex flex-col text-red-500"}>
		<Link href={"/blog/epstein_files"}>
			<h2 className={"underline"}>Epstein Files!</h2>
			<Image
				src={"/epstein.jpg"}
				alt={"Epstein Files"}
				width={250}
				height={100}
			/>
			Justice for the victims!
			Do not let the Trump crime family hide them!
		</Link>
	</div>
	)
}