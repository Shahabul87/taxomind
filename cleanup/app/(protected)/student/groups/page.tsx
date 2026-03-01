import { SidebarDemo } from "@/components/ui/sidebar-demo"
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateGroupPage } from "./create-group";

const GroupCreationPage = async() => {
    const user = await currentUser();

    if(!user?.id){
        return redirect("/");
    }
    
    const userId = user?.id;

    return (
        <SidebarDemo>
            <div>
                <CreateGroupPage />
            </div>
        </SidebarDemo>
    )
}

export default GroupCreationPage