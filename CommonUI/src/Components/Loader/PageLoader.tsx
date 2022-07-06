import React, { FunctionComponent, ReactElement } from "react";
import Loader, { LoaderType } from "./Loader";
import { Black } from "../../Utils/BrandColors";

export interface ComponentProps { 
    isVisible: boolean
}

const PageLoader: FunctionComponent<ComponentProps> = (props: ComponentProps): ReactElement => {
    if (props.isVisible) {
        return (
            <div className='row text-center vertical-center'><Loader loaderType={LoaderType.Bar} color={Black} size={200} /></div>
        )
    } else {
        return <></>
    }
};

export default PageLoader;