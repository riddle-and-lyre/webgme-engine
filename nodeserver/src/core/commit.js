define([
    'util/assert',
    'util/sha1',
    'common/CommonUtil'],
    function(ASSERT,SHA1,commonUtil){
        'use strict';

        var BRANCH_ID = "*";

        function commit(_project,_options){

            function getBranchHash(branch,oldhash,callback){
                var branchId = BRANCH_ID+branch;
                _project.getBranchHash(branchId,oldhash,callback);
            }

            function setBranchHash(branch,oldhash,newhash,callback){
                var branchId = BRANCH_ID+branch;
                _project.setBranchHash(branchId,oldhash,newhash,callback);
            }

            function makeCommit(branch,parents,roothash,msg){
                var branchId = BRANCH_ID+branch;
                parents = parents || [];
                msg = msg || "n/a";

                var commitObj = {
                    _id     : "",
                    root    : roothash,
                    parents : parents,
                    updater : ['TODO'],
                    time    : commonUtil.timestamp(),
                    message : msg,
                    name    : branch,
                    type    : "commit"
                };

                commitObj._id = '#' + SHA1(JSON.stringify(commitObj));
                _project.insertObject(commitObj,function(err){
                    //TODO there is nothing we can do with this...
                });
                return commitObj._id;
            }

            return {
                commit: makeCommit,
                getBranchNames: _project.getBranchNames,
                getBranchHash: getBranchHash,
                setBranchHash: setBranchHash
            }

        }
        return commit;
    });
