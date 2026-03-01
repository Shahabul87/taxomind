import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnhancedCourseCreationPage } from "./enhanced-course-creation";

const EnhancedCreatePage = async() => {
    const user = await currentUser();

    if(!user?.id){
        return redirect("/");
    }

    return <EnhancedCourseCreationPage />;
};

export default EnhancedCreatePage;