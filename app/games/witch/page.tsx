// Example: in app/page.tsx or any other page/component
 // ← no curly braces

// Then use it normally
import Rogue from "@/components/games/Rogue";
import {FullScreen} from "@/emoji-ui/ui/FullScreen";

export default function () {
	return (
		<FullScreen open={true}>
			<Rogue/>
		</FullScreen>
	);
}